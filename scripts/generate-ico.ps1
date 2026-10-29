Add-Type -AssemblyName System.Drawing

$srcPath = "d:\Biblioteca\Github Projects\GameDiaryApp\public\favicon.png"
$src48Path = "d:\Biblioteca\Github Projects\GameDiaryApp\public\favicon-48x48.png"
$destPath = "d:\Biblioteca\Github Projects\GameDiaryApp\public\favicon.ico"

Write-Host "Loading source images..."
$bmpOriginal = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source favicon.png is $($bmpOriginal.Width)x$($bmpOriginal.Height)"

$sizes = @(16, 32, 48, 64)
$imagesData = @()

foreach ($sz in $sizes) {
    $resized = New-Object System.Drawing.Bitmap $sz, $sz
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($bmpOriginal, 0, 0, $sz, $sz)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bytes = $ms.ToArray()
    $ms.Dispose()
    $resized.Dispose()

    $imagesData += ,@($sz, $bytes)
    Write-Host "Generated $sz x $sz PNG payload ($($bytes.Length) bytes)"
}

$bmpOriginal.Dispose()

# Now construct the ICO binary stream
# ICONDIR Header:
# 0-1: Reserved (0)
# 2-3: Resource Type (1 for icon)
# 4-5: Number of images (4)
$fs = [System.IO.File]::Create($destPath)
$bw = New-Object System.IO.BinaryWriter $fs

$bw.Write([UInt16]0) # Reserved
$bw.Write([UInt16]1) # Type 1 = ICO
$bw.Write([UInt16]$imagesData.Count) # Image count

# Calculate offsets
# Header is 6 bytes.
# Each directory entry is 16 bytes.
# Offset of first image data = 6 + (16 * count)
$offset = 6 + (16 * $imagesData.Count)

foreach ($item in $imagesData) {
    $sz = $item[0]
    $data = $item[1]

    $wByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $hByte = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }

    $bw.Write($wByte)            # Width
    $bw.Write($hByte)            # Height
    $bw.Write([byte]0)            # Color count (0 for 32bpp)
    $bw.Write([byte]0)            # Reserved
    $bw.Write([UInt16]1)          # Color planes
    $bw.Write([UInt16]32)         # Bits per pixel
    $bw.Write([UInt32]$data.Length) # Image data size
    $bw.Write([UInt32]$offset)      # Offset of image data

    $offset += $data.Length
}

# Write each image's PNG data
foreach ($item in $imagesData) {
    $data = $item[1]
    $bw.Write($data)
}

$bw.Flush()
$bw.Dispose()
$fs.Dispose()

Write-Host "Successfully created $destPath ($( (Get-Item $destPath).Length ) bytes)"

export const languageConfig = {
  code: 'en',
  name: 'English',
  nativeName: 'English',
  flag: 'us',
  locale: 'en-US'
};

export const translations = {
  // Navigation
  nav: {
    home: 'Home',
    about: 'About',
    projects: 'Projects',
    contact: 'Contact',
    dashboard: 'Dashboard',
    premium: 'Premium',
    apiKeys: 'API Keys',
    serials: 'Serials',
    logout: 'Logout',
    login: 'Login'
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    appName: 'My Application'
  },

  // Welcome
  welcome: {
    title: 'Welcome',
    message: 'Hello {{name}}!',
    description: 'This is a template project with internationalization.',
    greeting: 'Welcome back, {{name}}!'
  },

  // Authentication
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    loginSuccess: 'Login successful!',
    registerSuccess: 'Registration successful!',
    loginError: 'Login error',
    registerError: 'Registration error'
  },

  // Footer
  footer: {
    text: '© {{year}} Your Company. All rights reserved.',
    madeWith: 'Made with ❤️'
  },

  // Examples with variables
  user: {
    greeting: 'Welcome back, {{name}}!',
    profile: '{{name}}\'s Profile'
  },
  
  items: {
    count: 'You have {{count}} items',
    selected: '{{count}} items selected'
  },
  
  time: {
    lastUpdate: 'Last updated: {{date}}',
    createdAt: 'Created at {{date}}'
  },

  // Toast messages
  toast: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information'
  }
};
import Cookies from 'js-cookie';

export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

export const setCookie = (
  name: string,
  value: string,
  days: number = 365
): void => {
  Cookies.set(name, value, { expires: days, path: '/' });
};

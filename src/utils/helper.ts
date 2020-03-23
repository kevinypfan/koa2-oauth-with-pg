import { URL } from "url";

export var delay = function(s) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, s);
  });
};

export const urlParser = url => {
  const parsedUrl = new URL(url);
  let path = parsedUrl.pathname;
  if (parsedUrl.pathname.endsWith("/")) {
    path = parsedUrl.pathname.slice(0, parsedUrl.pathname.length - 1);
  }

  return parsedUrl.origin + path;
};

// The root path needs an explicit route next to the catch-all, which does not
// match "/" in this Nitro version.
export { default } from "./[...page].get.js";

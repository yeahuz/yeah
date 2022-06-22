import { NODE_ENV } from "./secrets.js";
import { configs } from "./configs.js";

const env = NODE_ENV || "development";

export default configs[env];

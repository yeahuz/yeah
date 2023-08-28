import config from "../config/index.js";
import Hashids from "hashids";

export let hashids = new Hashids(config.rp_name, 5);

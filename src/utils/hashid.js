import config from '../config/index.js';
import Hashids from 'hashids';

export const hashids = new Hashids(config.rp_name);

import * as CFR2Service from "./cfr2.service.js";
import * as CFImageService from "./cfimg.service.js";

export async function get_upload_urls(files = [], file) {
  if (file) {
    let get_url = !file.is_image ? CFR2Service.get_direct_upload_url : CFImageService.get_direct_upload_url;
    return await get_url(file);
  }

  let urls = {}
  let promises = files.map(async file => {
    let get_url = !file.is_image ? CFR2Service.get_direct_upload_url : CFImageService.get_direct_upload_url;
    let result = await get_url(file);
    urls[file.temp_id] = result;
    return result;
  })

  await Promise.all(promises);

  return urls;
}

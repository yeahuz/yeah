import * as CFR2Service from "./cfr2.service.js";
import * as CFImageService from "./cfimg.service.js";

export async function get_upload_urls(files = []) {
  const images_arr = [];
  const files_arr = [];
  for (let i = 0, len = files.length; i < len; i++) {
    const file = files[i]
    if (file.is_image) {
      images_arr.push(file)
    } else files_arr.push(file)
  }

  const [image_urls, file_urls] = await Promise.all([
    CFImageService.get_direct_upload_urls(images_arr),
    CFR2Service.get_direct_upload_urls(files_arr)
  ])

  return { images: image_urls, files: file_urls }
}

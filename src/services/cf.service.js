import * as CFR2Service from "./cfr2.service.js";
import * as CFImageService from "./cfimg.service.js";

export async function get_upload_urls(files = []) {
  const images = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file.is_image) {
      images.push(file)
      files.splice(i, 1)
    }
  }

  const [image_urls, file_urls] = await Promise.all([
    CFImageService.get_direct_upload_urls(images),
    CFR2Service.get_direct_upload_urls(files)
  ])

  return { images: image_urls, files: file_urls }
}

import * as eta from "eta";
import { promises as fs } from "fs";
import path from "path";

const file_exists = async (path) => {
  return !!(await fs.stat(path).catch((_) => false));
};

eta.configure({
  root: path.join(process.cwd(), "src/views"),
});

const render_file = async (templatePath, ...props) => {
  try {
    const ext = path.extname(templatePath);
    templatePath = ext ? templatePath : templatePath + ".html";
    const exists = await file_exists(path.join(process.cwd(), `src/views/${templatePath}`));
    if (exists) return await eta.renderFile(templatePath, ...props);
  } catch (err) {
    console.log(err);
    return await eta.renderFile("/500.html", ...props);
  }
};

export { eta, render_file };

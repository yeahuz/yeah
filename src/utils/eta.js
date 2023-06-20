import { Eta } from "eta";
import { promises as fs } from "fs";
import path from "path";

const file_exists = async (path) => {
  return !!(await fs.stat(path).catch((_) => false));
};

const eta = new Eta({
  views: path.join(process.cwd(), "src/views"),
})

const render_file = async (templatePath, params = {}) => {
  try {
    const ext = path.extname(templatePath);
    templatePath = ext ? templatePath : templatePath + ".html";
    const exists = await file_exists(path.join(process.cwd(), `src/views/${templatePath}`));
    if (exists) return await eta.renderAsync(templatePath, params);
  } catch (err) {
    console.log(err);
    return await eta.renderAsync("/500.html", params);
  }
};

export { eta, render_file };

import { getData, findModule, findStudent, findProf } from '../repository.js';
import { moduleSummary, moduleDetails, studentSummary, profSummary } from '../representations.js';
import { readPagination, buildPage } from '../pagination.js';

function notFound(res, code) {
  return res.status(404).json({ error: `Module ${code} not found` });
}

// GET /modules?page=1&limit=20
export function listModules(req, res) {
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const modules = getData().modules.map(moduleSummary);
  res.status(200).json(buildPage(modules, pagination, '/modules', 'modules'));
}

// GET /modules/:code
export function getModule(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res, req.params.code);
  }
  res.status(200).json(moduleDetails(mod));
}

// GET /modules/:code/students: the students registered in the module
export function listModuleStudents(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res, req.params.code);
  }
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const students = mod.registeredStudents
    .map((ine) => findStudent(ine))
    .filter((student) => student !== undefined)
    .map(studentSummary);
  const basePath = `/modules/${mod.code_module}/students`;
  res.status(200).json(buildPage(students, pagination, basePath, 'students'));
}

// GET /modules/:code/profs: the profs who teach the module
export function listModuleProfs(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res, req.params.code);
  }
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const profs = mod.profs
    .map((number) => findProf(number))
    .filter((prof) => prof !== undefined)
    .map(profSummary);
  const basePath = `/modules/${mod.code_module}/profs`;
  res.status(200).json(buildPage(profs, pagination, basePath, 'profs'));
}

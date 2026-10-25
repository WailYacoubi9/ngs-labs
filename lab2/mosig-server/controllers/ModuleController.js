import { getData, findModule } from '../repository.js';
import {
  moduleId,
  moduleSummary,
  moduleDetails,
  studentReference,
  profReference,
} from '../representations.js';
import { readPagination, buildPage } from '../pagination.js';

function notFound(res) {
  return res.status(404).json({ error: 'module not found' });
}

// GET /modules?page=1&limit=20
export function listModules(req, res) {
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const modules = getData().modules.map(moduleSummary);
  res.status(200).json(buildPage(modules, pagination, '/modules'));
}

// GET /modules/:code, where the code is in lower case: /modules/oop
export function getModule(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res);
  }
  res.status(200).json(moduleDetails(mod));
}

// GET /modules/:code/enrolled_students: the students registered in the module
export function listEnrolledStudents(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res);
  }
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const students = mod.registeredStudents.map(studentReference);
  const basePath = `/modules/${moduleId(mod.code_module)}/enrolled_students`;
  res.status(200).json(buildPage(students, pagination, basePath));
}

// GET /modules/:code/teachers: the profs who teach the module
export function listTeachers(req, res) {
  const mod = findModule(req.params.code);
  if (!mod) {
    return notFound(res);
  }
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const profs = mod.profs.map(profReference);
  const basePath = `/modules/${moduleId(mod.code_module)}/teachers`;
  res.status(200).json(buildPage(profs, pagination, basePath));
}

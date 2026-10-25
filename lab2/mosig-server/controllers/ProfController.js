import { getData, findProf } from '../repository.js';
import { profSummary, profDetails, moduleReference } from '../representations.js';
import { readPagination, buildPage } from '../pagination.js';

function notFound(res) {
  return res.status(404).json({ error: 'prof not found' });
}

// GET /profs?page=1&limit=20
export function listProfs(req, res) {
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const profs = getData().profs.map(profSummary);
  res.status(200).json(buildPage(profs, pagination, '/profs'));
}

// GET /profs/:number
export function getProf(req, res) {
  const prof = findProf(req.params.number);
  if (!prof) {
    return notFound(res);
  }
  res.status(200).json(profDetails(prof));
}

// GET /profs/:number/taught_modules: the modules taught by the prof
export function listTaughtModules(req, res) {
  const prof = findProf(req.params.number);
  if (!prof) {
    return notFound(res);
  }
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const modules = prof.taught_modules.map(moduleReference);
  res.status(200).json(buildPage(modules, pagination, `/profs/${prof.number}/taught_modules`));
}

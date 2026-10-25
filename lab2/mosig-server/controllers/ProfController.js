import { getData, findProf } from '../repository.js';
import { profSummary, profDetails } from '../representations.js';
import { readPagination, buildPage } from '../pagination.js';

// GET /profs?page=1&limit=20
export function listProfs(req, res) {
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }
  const profs = getData().profs.map(profSummary);
  res.status(200).json(buildPage(profs, pagination, '/profs', 'profs'));
}

// GET /profs/:number
export function getProf(req, res) {
  const prof = findProf(req.params.number);
  if (!prof) {
    return res.status(404).json({ error: `Prof ${req.params.number} not found` });
  }
  res.status(200).json(profDetails(prof));
}

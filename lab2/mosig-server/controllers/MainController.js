import { getData, findProf } from '../repository.js';
import { shortName } from '../representations.js';

// GET /: incomplete representation of the master, with the links to navigate the API
export function getMaster(req, res) {
  const data = getData();

  const head = data.responsibles
    .map((number) => findProf(number))
    .filter((prof) => prof !== undefined)
    .map((prof) => ({ name: shortName(prof), href: `/profs/${prof.number}` }));

  res.status(200).json({
    name: data.name,
    _links: {
      students: { href: '/students' },
      profs: { href: '/profs' },
      modules: { href: '/modules' },
      head,
    },
  });
}

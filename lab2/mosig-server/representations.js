// The API never sends the stored objects as they are: it builds representations,
// with the field names of the specification and links to the related resources.

// "Sonni M.", as in the heads of the master
export function shortName(person) {
  return `${person.lastname} ${person.firstname.charAt(0)}.`;
}

export function fullName(person) {
  return `${person.lastname} ${person.firstname}`;
}

function moduleLinks(codes) {
  return codes.map((code) => ({ code, href: `/modules/${code}` }));
}

export function studentSummary(student) {
  return {
    ine: student.ine,
    name: fullName(student),
    _links: { self: { href: `/students/${student.ine}` } },
  };
}

export function studentDetails(student) {
  return {
    ine: student.ine,
    firstName: student.firstname,
    lastName: student.lastname,
    email: student.email,
    birthDate: student.birthdate,
    _links: {
      self: { href: `/students/${student.ine}` },
      modules: moduleLinks(student.followed_modules),
    },
  };
}

export function profSummary(prof) {
  return {
    number: prof.number,
    name: fullName(prof),
    _links: { self: { href: `/profs/${prof.number}` } },
  };
}

export function profDetails(prof) {
  return {
    number: prof.number,
    firstName: prof.firstname,
    lastName: prof.lastname,
    email: prof.email,
    birthDate: prof.birthdate,
    office: prof.office,
    category: prof.category ?? null,
    _links: {
      self: { href: `/profs/${prof.number}` },
      modules: moduleLinks(prof.taught_modules),
    },
  };
}

export function moduleSummary(mod) {
  return {
    code: mod.code_module,
    label: mod.label,
    _links: { self: { href: `/modules/${mod.code_module}` } },
  };
}

export function moduleDetails(mod) {
  return {
    code: mod.code_module,
    label: mod.label,
    description: mod.description,
    coefficient: mod.coefficient,
    evaluations: mod.evaluations,
    _links: {
      self: { href: `/modules/${mod.code_module}` },
      students: { href: `/modules/${mod.code_module}/students` },
      profs: { href: `/modules/${mod.code_module}/profs` },
    },
  };
}

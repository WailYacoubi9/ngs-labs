// The API never sends the stored objects as they are: it builds the same representations
// as the lab 1 server, with the field names of the specification and links to the relations.

// "Sonni M.", as in the heads of the master and in the collections
export function shortName(person) {
  return `${person.lastname} ${person.firstname.charAt(0)}.`;
}

// In URLs, a module is identified by its code in lower case: /modules/oop
export function moduleId(code) {
  return code.toLowerCase();
}

export function studentSummary(student) {
  return {
    name: shortName(student),
    ine: student.ine,
    _links: { self: { href: `/students/${student.ine}` } },
  };
}

export function studentDetails(student) {
  return {
    firstName: student.firstname,
    lastName: student.lastname,
    ine: student.ine,
    email: student.email,
    birthDate: student.birthdate,
    _links: {
      followed_modules: { href: `/students/${student.ine}/followed_modules` },
    },
  };
}

// Item of /modules/:code/enrolled_students
export function studentReference(ine) {
  return { ine, href: `/students/${ine}/` };
}

export function profSummary(prof) {
  return {
    name: shortName(prof),
    number: prof.number,
    _links: { self: { href: `/profs/${prof.number}` } },
  };
}

export function profDetails(prof) {
  return {
    firstName: prof.firstname,
    lastName: prof.lastname,
    number: prof.number,
    email: prof.email,
    birthDate: prof.birthdate,
    _links: {
      taught_modules: { href: `/profs/${prof.number}/taught_modules` },
    },
  };
}

// Item of /modules/:code/teachers: like the lab 1 server, "name" holds the number of the prof
export function profReference(number) {
  return { name: number, href: `/profs/${number}/` };
}

export function moduleSummary(mod) {
  return {
    name: mod.code_module,
    _links: { self: { href: `/modules/${moduleId(mod.code_module)}` } },
  };
}

export function moduleDetails(mod) {
  const id = moduleId(mod.code_module);
  return {
    name: mod.code_module,
    label: mod.label,
    description: mod.description,
    coefficient: mod.coefficient,
    evaluations: mod.evaluations,
    _links: {
      enrolled_students: { href: `/modules/${id}/enrolled_students` },
      teachers: { href: `/modules/${id}/teachers` },
    },
  };
}

// Item of /students/:ine/followed_modules and /profs/:number/taught_modules
export function moduleReference(code) {
  return { name: code, href: `/modules/${moduleId(code)}/` };
}

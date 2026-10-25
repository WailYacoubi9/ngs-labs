import { getData, findStudent } from '../repository.js';
import { studentSummary, studentDetails } from '../representations.js';
import { readPagination, buildPage } from '../pagination.js';

const INE_PATTERN = /^[a-zA-Z0-9-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// _links is accepted (and ignored) so a client can send back a representation it received
const ACCEPTED_FIELDS = ['ine', 'firstName', 'lastName', 'email', 'birthDate', '_links'];

function notFound(res, ine) {
  return res.status(404).json({ error: `Student ${ine} not found` });
}

function badRequest(res, error) {
  return res.status(400).json({ error });
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isDate(value) {
  return typeof value === 'string' && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

// Checks a request body and returns an error message, or null when the body is valid.
// requireNames: firstName and lastName must be present (POST and PUT)
// ine: when given, the body may not contain another ine (PUT and PATCH)
function validate(body, { requireNames, ine }) {
  if (!isObject(body)) {
    return 'The body must be a JSON object (header Content-Type: application/json)';
  }
  const unknownField = Object.keys(body).find((key) => !ACCEPTED_FIELDS.includes(key));
  if (unknownField !== undefined) {
    return `Unknown field: ${unknownField}`;
  }
  if (ine !== undefined && 'ine' in body && body.ine !== ine) {
    return 'The ine of a student cannot be changed';
  }
  if (requireNames && !('firstName' in body && 'lastName' in body)) {
    return 'firstName and lastName are required';
  }
  if ('firstName' in body && !isNonEmptyString(body.firstName)) {
    return 'firstName must be a non-empty string';
  }
  if ('lastName' in body && !isNonEmptyString(body.lastName)) {
    return 'lastName must be a non-empty string';
  }
  if ('email' in body && !(Array.isArray(body.email) && body.email.every(isNonEmptyString))) {
    return 'email must be an array of strings';
  }
  if ('birthDate' in body && body.birthDate !== null && !isDate(body.birthDate)) {
    return 'birthDate must be a date like 2001-09-30';
  }
  return null;
}

// GET /students?page=1&limit=20
export function listStudents(req, res) {
  const pagination = readPagination(req.query);
  if (pagination.error) {
    return badRequest(res, pagination.error);
  }
  const students = getData().students.map(studentSummary);
  res.status(200).json(buildPage(students, pagination, '/students', 'students'));
}

// GET /students/:ine
export function getStudent(req, res) {
  const student = findStudent(req.params.ine);
  if (!student) {
    return notFound(res, req.params.ine);
  }
  res.status(200).json(studentDetails(student));
}

// POST /students
export function createStudent(req, res) {
  const body = req.body;
  const error = validate(body, { requireNames: true });
  if (error) {
    return badRequest(res, error);
  }
  if (typeof body.ine !== 'string' || !INE_PATTERN.test(body.ine)) {
    return badRequest(res, 'ine is required and may only contain letters, digits and -');
  }
  if (findStudent(body.ine)) {
    return res.status(409).json({ error: `Student ${body.ine} already exists` });
  }

  const student = {
    lastname: body.lastName,
    firstname: body.firstName,
    email: body.email ?? [],
    followed_modules: [],
    birthdate: body.birthDate ?? null,
    ine: body.ine,
  };
  getData().students.push(student);

  res.set('Location', `/students/${student.ine}`);
  res.status(201).json(studentDetails(student));
}

// PUT /students/:ine: replaces the whole student, a missing optional field is emptied
export function replaceStudent(req, res) {
  const student = findStudent(req.params.ine);
  if (!student) {
    return notFound(res, req.params.ine);
  }
  const body = req.body;
  const error = validate(body, { requireNames: true, ine: student.ine });
  if (error) {
    return badRequest(res, error);
  }

  student.firstname = body.firstName;
  student.lastname = body.lastName;
  student.email = body.email ?? [];
  student.birthdate = body.birthDate ?? null;
  res.status(204).end();
}

// PATCH /students/:ine: changes only the fields present in the body
export function updateStudent(req, res) {
  const student = findStudent(req.params.ine);
  if (!student) {
    return notFound(res, req.params.ine);
  }
  const body = req.body;
  const error = validate(body, { requireNames: false, ine: student.ine });
  if (error) {
    return badRequest(res, error);
  }

  if ('firstName' in body) student.firstname = body.firstName;
  if ('lastName' in body) student.lastname = body.lastName;
  if ('email' in body) student.email = body.email;
  if ('birthDate' in body) student.birthdate = body.birthDate;
  res.status(204).end();
}

// DELETE /students/:ine: the student is also removed from the modules it followed
export function deleteStudent(req, res) {
  const data = getData();
  const index = data.students.findIndex((student) => student.ine === req.params.ine);
  if (index === -1) {
    return notFound(res, req.params.ine);
  }

  data.students.splice(index, 1);
  for (const mod of data.modules) {
    mod.registeredStudents = mod.registeredStudents.filter((ine) => ine !== req.params.ine);
  }
  res.status(204).end();
}

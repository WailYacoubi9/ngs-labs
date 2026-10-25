import * as MainController from './controllers/MainController.js';
import * as StudentController from './controllers/StudentController.js';
import * as ProfController from './controllers/ProfController.js';
import * as ModuleController from './controllers/ModuleController.js';

// Turns an error thrown by a controller (for example when data.json is missing) into a JSON answer
function safe(handler) {
  return (req, res) => {
    try {
      handler(req, res);
    } catch (err) {
      console.error(err);
      const error = err.code === 'ENOENT' ? 'Data file not found' : 'Internal server error';
      res.status(500).json({ error });
    }
  };
}

// The same routes work on Express and on tiny-rest, since both offer get, post, put, patch and delete
export default function registerRoutes(app) {
  app.get('/', safe(MainController.getMaster));

  app.get('/students', safe(StudentController.listStudents));
  app.post('/students', safe(StudentController.createStudent));
  app.get('/students/:ine', safe(StudentController.getStudent));
  app.put('/students/:ine', safe(StudentController.replaceStudent));
  app.patch('/students/:ine', safe(StudentController.updateStudent));
  app.delete('/students/:ine', safe(StudentController.deleteStudent));

  app.get('/profs', safe(ProfController.listProfs));
  app.get('/profs/:number', safe(ProfController.getProf));

  app.get('/modules', safe(ModuleController.listModules));
  app.get('/modules/:code', safe(ModuleController.getModule));
  app.get('/modules/:code/students', safe(ModuleController.listModuleStudents));
  app.get('/modules/:code/profs', safe(ModuleController.listModuleProfs));
}

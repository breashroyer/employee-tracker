const inquirer = require('inquirer');
const connectToDatabase = require('./db'); // Assume this returns a promise-based connection

async function mainMenu(db) {
  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View All Departments',
          'View All Roles',
          'View All Employees',
          'Add a Department',
          'Add a Role',
          'Add an Employee',
          'Update an Employee Role',
          'Exit'
        ]
      },
    ]);

    switch (action) {
        case 'View All Departments':
          await viewAllDepartments(db);
          break;
        case 'View All Roles':
          await viewAllRoles(db);
          break;
        case 'View All Employees':
          await viewAllEmployees(db);
          break;
        case 'Add a Department':
          await addDepartment(db);
          break;
        case 'Add a Role':
          await addRole(db);
          break;
        case 'Add an Employee':
          await addEmployee(db);
          break;
        case 'Update an Employee Role':
          await updateEmployeeRole(db); // Make sure db is passed here
          break;
        case 'Exit':
          db.end();
          console.log('Goodbye!');
          break;
        default:
          console.log('Invalid action');
          await mainMenu(db);
      }
    } catch (error) {
      console.error('Error in main menu:', error);
    }
  }

  async function viewAllDepartments(db) {
    try {
      const [results] = await db.query('SELECT * FROM department');
      console.log('\n');
      console.table(results);
      await mainMenu(db); // Return to the main menu after displaying results
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  async function viewAllRoles(db) {
    try {
        const [roles] = await db.query('SELECT role.id, role.title, department.name AS department, role.salary FROM role INNER JOIN department ON role.department_id = department.id');
        console.log('\n');
        console.table(roles);
        await mainMenu(db); // Pass the db object
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
}


async function viewAllEmployees(db) {
    const [employees] = await db.query(`
        SELECT e.id, e.first_name, e.last_name, 
               role.title, department.name AS department, 
               role.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager 
        FROM employee e
        LEFT JOIN employee m ON e.manager_id = m.id
        INNER JOIN role ON e.role_id = role.id
        INNER JOIN department ON role.department_id = department.id
    `);
    console.log('\n');
    console.table(employees);
    await mainMenu(db); // Pass the db object
}


async function addDepartment(db) {
    // console.log('DB object:', db); // Add this line to check the db object
    const { departmentName } = await inquirer.prompt([
        {
            type: 'input',
            name: 'departmentName',
            message: 'What is the name of the department?',
        },
    ]);

    await db.query('INSERT INTO department (name) VALUES (?)', [departmentName]);
    console.log(`${departmentName} department added successfully.`);
    await mainMenu(db); // Pass the db object here
}


async function addRole(db) {
    const [departments] = await db.query('SELECT id, name FROM department');
    const departmentChoices = departments.map(({ id, name }) => ({
        name: name,
        value: id,
    }));

    const { title, salary, departmentId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'What is the title of the role?',
        },
        {
            type: 'input',
            name: 'salary',
            message: 'What is the salary of the role?',
            validate: function(value) {
                // Check if the input is a valid number
                const isValidNumber = !isNaN(parseFloat(value)) && isFinite(value);
                return isValidNumber ? true : 'Please enter a valid number for the salary.';
            },
        },
        {
            type: 'list',
            name: 'departmentId',
            message: 'Which department does the role belong to?',
            choices: departmentChoices,
        },
    ]);

    // Remove special characters from the salary value and parse it as a float
    const formattedSalary = parseFloat(salary.replace(/[^\d.-]/g, ''));

    await db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [title, formattedSalary, departmentId]);
    console.log(`${title} role added successfully.`);
    await mainMenu(db);
}


async function addEmployee(db) {
    const [roles] = await db.query('SELECT id, title FROM role');
    const roleChoices = roles.map(({ id, title }) => ({
        name: title,
        value: id,
    }));

    const { firstName, lastName, roleId } = await inquirer.prompt([
        {
            type: 'input',
            name: 'firstName',
            message: 'What is the first name of the employee?',
        },
        {
            type: 'input',
            name: 'lastName',
            message: 'What is the last name of the employee?',
        },
        {
            type: 'list',
            name: 'roleId',
            message: 'What is the role of the employee?',
            choices: roleChoices,
        },
        // You could also add manager selection here
    ]);

    await db.query('INSERT INTO employee (first_name, last_name, role_id) VALUES (?, ?, ?)', [firstName, lastName, roleId]);
    console.log(`${firstName} ${lastName} added as an employee.`);
    await mainMenu(db);
}

async function updateEmployeeRole(db) {
    try {
        console.log("Fetching employees from the database...");
        const [employees] = await db.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee');
        console.log("Employees fetched successfully:", employees);

        const employeeChoices = employees.map(({ id, name }) => ({
            name: name,
            value: id,
        }));

        console.log("Fetching roles from the database...");
        const [roles] = await db.query('SELECT id, title FROM role');
        console.log("Roles fetched successfully:", roles);

        const roleChoices = roles.map(({ id, title }) => ({
            name: title,
            value: id,
        }));

        console.log("Prompting user to select employee and new role...");
        const { employeeId, roleId } = await inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee\'s role do you want to update?',
                choices: employeeChoices,
            },
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role do you want to assign to the selected employee?',
                choices: roleChoices,
            },
        ]);

        console.log("Updating employee's role in the database...");
        await db.query('UPDATE employee SET role_id = ? WHERE id = ?', [roleId, employeeId]);
        console.log('Employee role updated successfully.');
        await mainMenu(db); // Call the main menu function to return to the menu
    } catch (error) {
        console.error('Error updating employee role:', error);
    }
}


async function startApp() {
    try {
      const db = await connectToDatabase(); // Assuming this returns a promise-based connection
      await mainMenu(db);
    } catch (error) {
      console.error('Error starting the application:', error);
    }
  }

  // Call the startApp function to initiate the application
startApp();

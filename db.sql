DROP DATABASE IF EXISTS clinic;
CREATE DATABASE clinic;
USE clinic;

drop table if exists patient;
Create table Patient (
   patient_id int (10) auto_increment,
   username varchar (20),
   first_name varchar (20),
   last_name varchar (20),
   password varchar (200),
primary key (patient_id)
);

DROP TABLE IF EXISTS doctor;
CREATE TABLE doctor(
	doctor_employee_id INT auto_increment,
   username varchar (20),
   first_name varchar (20),
   last_name varchar (20),
   password varchar (200),
   PRIMARY KEY(doctor_employee_id)
);

drop table if exists appointment;
Create table Appointment(
   appointment_id INT auto_increment,
   patient_id INT, 
   doctor_employee_id INT, 
   status VARCHAR (30),
   date DATETIME,
   FOREIGN KEY (patient_id) REFERENCES Patient (patient_id),
   FOREIGN KEY (doctor_employee_id) REFERENCES Doctor (doctor_employee_id),
   Primary key (appointment_id)
);

INSERT INTO appointment
VALUES (1,1,1,'Waiting','2023-01-23 12:45:56');
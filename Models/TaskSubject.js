class TaskSubject {
    constructor() {
        this.volunteers = [];
    }

    register(volunteer) {
        this.volunteers.push(volunteer);
    }

    notify() {
        this.volunteers.forEach(volunteer => {
            console.log(`Notifying volunteer: ${volunteer.name}`);
        });
    }
}

module.exports = TaskSubject;

const { program } = require("commander");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

program
    .requiredOption("-h, --host <host>", "Your host")
    .requiredOption("-p, --port <port>", "Your port")
    .requiredOption("-c, --cache <cache>", "Your cache");

program.parse();
const options = program.opts();

if (!fs.existsSync(options.cache)) {
    fs.promises.writeFile(options.cache, JSON.stringify([]));
}

const app = express();
app.use(express.text());
app.use(express.json());

const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Notes API",
            version: "1.0.0",
            description: "API for managing notes",
        },
        servers: [
            {
                url: `http://${options.host}:${options.port}`,
                description: "Local server",
            },
        ],
    },
    apis: [__filename], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Retrieve all notes
 *     tags:
 *       - Notes
 *     responses:
 *       200:
 *         description: A JSON array of all notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the note
 *                   text:
 *                     type: string
 *                     description: The content of the note
 *       500:
 *         description: Internal server error
 */
app.get("/notes", (req, res) => {
    fs.promises.readFile(options.cache)
        .then((notes) => {
            res.status(200).type("json").send(notes);
        })
        .catch(() => res.status(500).send("Internal server error"));
});

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Retrieve a note by name
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: The name of the note
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note content retrieved successfully
 *       404:
 *         description: Note not found
 */
app.get("/notes/:name", (req, res) => {
    fs.promises.readFile(options.cache)
        .then((json_notes) => {
            const notes = JSON.parse(json_notes);
            const note = notes.find((el) => el.name === req.params.name);
            if (note) {
                res.status(200).type("text").send(note.text);
            } else {
                res.status(404).end();
            }
        })
        .catch(() => res.status(500).send("Internal server error"));
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Update a note's content by name
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: The name of the note
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Updated content for the note
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *     responses:
 *       201:
 *         description: Note updated successfully
 *       404:
 *         description: Note not found
 */
app.put("/notes/:name", (req, res) => {
    fs.promises.readFile(options.cache)
        .then((json_notes) => {
            const notes = JSON.parse(json_notes);
            const note = notes.find((el) => el.name === req.params.name);
            if (note) {
                note.text = req.body;
                return fs.promises
                    .writeFile(options.cache, JSON.stringify(notes))
                    .then(() => res.status(201).end());
            } else {
                res.status(404).end();
            }
        })
        .catch(() => res.status(500).send("Internal server error"));
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Create a new note
 *     tags:
 *       - Notes
 *     requestBody:
 *       description: Note name and content
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Name of the note
 *               note:
 *                 type: string
 *                 description: Content of the note
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Note already exists
 */
app.post("/write", multer().none(), (req, res) => {
    fs.promises.readFile(options.cache)
        .then((json_notes) => {
            const notes = JSON.parse(json_notes);
            const exists = notes.some((el) => el.name === req.body.note_name);
            if (exists) {
                res.status(400).end();
            } else {
                notes.push({ name: req.body.note_name, text: req.body.note });
                return fs.promises
                    .writeFile(options.cache, JSON.stringify(notes))
                    .then(() => res.status(201).end());
            }
        })
        .catch(() => res.status(500).send("Internal server error"));
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Delete a note by name
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: The name of the note
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       404:
 *         description: Note not found
 */
app.delete("/notes/:name", (req, res) => {
    fs.promises.readFile(options.cache)
        .then((json_notes) => {
            const notes = JSON.parse(json_notes);
            const filteredNotes = notes.filter((el) => el.name !== req.params.name);
            if (notes.length !== filteredNotes.length) {
                return fs.promises
                    .writeFile(options.cache, JSON.stringify(filteredNotes))
                    .then(() => res.status(200).end());
            } else {
                res.status(404).end();
            }
        })
        .catch(() => res.status(500).send("Internal server error"));
});

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Retrieve the HTML upload form
 *     tags:
 *       - Upload
 *     responses:
 *       200:
 *         description: Returns the HTML upload form
 *       500:
 *         description: Internal server error
 */
app.get("/UploadForm.html", (req, res) => {
    fs.promises.readFile("UploadForm.html")
        .then((form) => res.status(200).type("html").send(form))
        .catch(() => res.status(500).send("Internal server error"));
});

// Start the server
app.listen(options.port, options.host, () => {
    console.log(`Server running at http://${options.host}:${options.port}`);
});

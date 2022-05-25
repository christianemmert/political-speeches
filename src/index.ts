import axios from "axios";
import express from "express";
import Papa from "papaparse";

const app = express();

const downloadCSV = async (url: string) => {
  const response = await axios.get(url, { method: "GET" });
  return Papa.parse(response.data).data;
};

const getDataProcessed = (data: any[], year: string, topic: string) => {
  const countSpeechesBySpeaker: { [key: string]: number } = {};
  const countSpeechesBySpeakerOnTopic: { [key: string]: number } = {};
  const countFewestWordsBySpeaker: { [key: string]: number } = {};

  data.splice(1).map((a: string[]) => {
    if (a[0]) {
      const speaker = a[0].trim();
      if (a[1]) {
        if (a[1].trim() === topic) {
          countSpeechesBySpeakerOnTopic[speaker] !== undefined
            ? (countSpeechesBySpeakerOnTopic[speaker] =
                countSpeechesBySpeakerOnTopic[speaker]! + 1)
            : (countSpeechesBySpeakerOnTopic[speaker] = 1);
        }
      }
      if (a[2]) {
        if (a[2].trim().split("-")[0] === year) {
          countSpeechesBySpeaker[speaker] !== undefined
            ? (countSpeechesBySpeaker[speaker] =
                countSpeechesBySpeaker[speaker]! + 1)
            : (countSpeechesBySpeaker[speaker] = 1);
        }
      }
      if (a[3]) {
        countFewestWordsBySpeaker[speaker] !== undefined
          ? (countFewestWordsBySpeaker[speaker] =
              countFewestWordsBySpeaker[speaker]! + Number(a[3].trim()))
          : (countFewestWordsBySpeaker[speaker] = Number(a[3].trim()));
      }
    }
  });

  let mostSpeeches = null;
  let mostTopic = null;
  let leastWords = null;

  let temp = 0;
  for (const [key, value] of Object.entries(countSpeechesBySpeaker)) {
    if (value > temp) {
      temp = value;
      mostSpeeches = key;
    }
  }

  temp = 0;
  for (const [key, value] of Object.entries(countSpeechesBySpeakerOnTopic)) {
    if (value > temp) {
      temp = value;
      mostTopic = key;
    }
  }

  temp = 0;
  for (const [key, value] of Object.entries(countFewestWordsBySpeaker)) {
    if (value < temp || temp === 0) {
      temp = value;
      leastWords = key;
    }
  }

  return {
    mostSpeeches: mostSpeeches,
    mostSecurity: mostTopic,
    leastWords: leastWords,
  };
};

app.get("/evaluation", async (req, res, next) => {
  try {
    let { url } = req.query;
    const data: { [key: string]: object } = {};
    if (!url) {
      res.status(400).json("No URL provided");
    }

    if (typeof url === "string") {
      const csv = await downloadCSV(url);
      data[url] = getDataProcessed(csv, "2013", "Internal Security");
    }

    if (Array.isArray(url)) {
      await Promise.all(
        url.map(async (e) => {
          const csv = await downloadCSV(`${e}`);
          data[`${e}`] = getDataProcessed(csv, "2013", "Internal Security");
        })
      );
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.listen(8080);

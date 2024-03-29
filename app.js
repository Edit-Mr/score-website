/** @format */

// 載入需要的套件
const express = require("express");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express(); // 初始化 express 網頁伺服器
const PORT = process.env.PORT || 3000; // 設定網頁伺服器的通訊埠號
app.use(bodyParser.json()); // 讓程式能夠解析 JSON 格式的請求
app.use(bodyParser.urlencoded({ extended: true })); // 讓程式能夠解析 URL-encoded 格式的請求

// 載入學生的密碼資料
let passwords = {};
fs.createReadStream("passwords.csv")
    .pipe(csv())
    .on("data", row => {
        passwords[row.IDNumber] = row.password;
    })
    .on("end", () => {
        console.log("Passwords loaded:", passwords);
    })
    .on("error", error => {
        console.error("Error loading passwords:", error);
    });

// 當網頁伺服器收到用戶端送來的 HTTP GET 請求時，回應一個 HTML 檔案
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 當網頁伺服器收到用戶端送來的 HTTP POST 請求時，回應一個 JSON 格式的資料
app.post("/scores", (req, res) => {
    // 從用戶端送來的請求中取得學生的 IDNumber 和 password
    const idNumber = req.body.idNumber;
    const password = req.body.password;
    console.log("正在驗證", idNumber, password);
    // 驗證學生的身份
    if (!passwords[idNumber]) {
        // 如果找不到學生的 IDNumber，就回傳 401 錯誤碼
        return res.status(401).send("無此學生");
    } else if (passwords[idNumber] != password) {
        // 如果密碼不正確，就回傳 401 錯誤碼
        return res.status(401).send("密碼錯誤");
    }
    // 讀取學生的成績資料
    var scores = [];
    fs.createReadStream("scores.csv")
        .pipe(csv())
        .on("data", row => {
            // 如果找到學生的 IDNumber，就把成績資料加入 scores 陣列
            if (row.IDNumber == idNumber) {
                // 把成績資料轉換成 {title: "科目名稱", score: 分數} 的格式
                for (let key in row) {
                    if (key != "IDNumber") {
                        scores.push({
                            title: key,
                            score: row[key],
                        });
                    }
                }
            }
        })
        .on("end", () => {
            console.log("成績已載入:", scores);
            // 把成績資料回傳給用戶端
            res.send(scores);
        })
        .on("error", error => {
            console.error("載入時失敗:", error);
            res.status(500).send("伺服器錯誤");
        });
});

// 啟動網頁伺服器，開始監聽通訊埠號
app.listen(PORT, () => {
    console.log(`網頁伺服器已經啟動，請訪問 http://localhost:${PORT}`);
});

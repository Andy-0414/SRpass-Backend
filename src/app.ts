import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import axios from "axios";
import cherrio from "cheerio";

import "dotenv/config";
import Log from "./module/Log";

const app: express.Application = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

app.use(cors()); // CORS 설정 미들웨어
app.use(helmet()); // 보안 미들웨어
app.use(compression()); // 데이터 압축 미들웨어

app.use(express.static("public")); // public 폴더의 파일을 제공함
app.use(express.urlencoded({ limit: "20mb", extended: false })); // urlencode 지원
app.use(express.json({ limit: "20mb" })); // json 지원

app.post("/get-information", async (req: Request, res: Response) => {
	let data = {
		schulCode: String(req.body.schulCode), // 학교 코드 ex) B100000658
		schulNm: String(req.body.schulNm), // 학교 이름 ex) 선린인터넷고등학교
		pName: String(req.body.pName), // 학생 이름 ex) 홍길동
		frnoRidno: String(req.body.frnoRidno), // 생년 월일 ex) 020414
	};

	let form = new URLSearchParams();
	form.append("schulCode", data.schulCode);
	form.append("schulNm", data.schulNm);
	form.append("pName", data.pName);
	form.append("frnoRidno", data.frnoRidno);

	let response = (await axios.post("https://eduro.sen.go.kr/stv_cvd_co00_012.do", form)).data.resultSVO.data;

	// 실패
	if (response.rtnRsltCode != "SUCCESS")
		return res.status(400).send({
			result: false,
			message: "잘못된 요청입니다.",
		});
	// 성공
	return res.status(200).send({
		result: true,
		response,
		message: "성공",
	});
});

app.post("/check-inspection", async (req: Request, res: Response) => {
	let data = {
		qstnCrtfcNoEncpt: String(req.body.qstnCrtfcNoEncpt), // 학생 자가진단 고유 코드
		temp: Number(req.body.temp), // 발열 유무 1: 발열 0: 발열 없음
	};
	// 온도값이 없을경우 해당 코드 유효성 검사
	if (isNaN(data.temp)) {
		let html = (await axios.get(`https://eduro.sen.go.kr/stv_cvd_co00_000.do?k=${data.qstnCrtfcNoEncpt}`)).data;
		let result = String(cherrio(html).find("#rtnRsltCode").val());
		if (result != "SUCCESS")
			return res.status(200).send({
				result: false,
				message: "잘못된 요청입니다.",
			});
		return res.status(200).send({
			result: true,
			message: "유효한 코드입니다.",
		});
	}
	let co01form = new URLSearchParams();
	co01form.append("rtnRsltCode", "SUCCESS");
	co01form.append("qstnCrtfcNoEncpt", data.qstnCrtfcNoEncpt);
	co01form.append("rspns01", "1");
	co01form.append("rspns02", "1");
	co01form.append("rspns07", "0");
	co01form.append("rspns08", "0");
	co01form.append("rspns09", "0");
	let co01 = (await axios.post("https://eduro.sen.go.kr/stv_cvd_co01_000.do", co01form)).data.resultSVO.data;

	let co02form = new URLSearchParams();
	co02form.append("rtnRsltCode", "SUCCESS");
	co02form.append("qstnCrtfcNoEncpt", data.qstnCrtfcNoEncpt);
	co02form.append("schulNm", co01.schulNm);
	co02form.append("stdntName", co01.stdntName);
	co02form.append("rspns01", "1");
	co02form.append("rspns02", "1");
	co02form.append("rspns07", "0");
	co02form.append("rspns08", "0");
	co02form.append("rspns09", "0");

	let co02 = (await axios.post("https://eduro.sen.go.kr/stv_cvd_co02_000.do", co02form)).data;

	// TODO: 자가진단 로직 구현
	res.status(200).send({
		result: true,
		message: "성공",
	});
});

const server = app.listen(port, () => {
	Log.i(`PORT : ${port}`);
});

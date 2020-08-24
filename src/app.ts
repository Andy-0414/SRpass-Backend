import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import axios from "axios";

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
		data,
		message: "성공",
	});
});

app.post("/check-inspection", async (req: Request, res: Response) => {
	let data = {
		qstnCrtfcNoEncpt: String(req.body.qstnCrtfcNoEncpt), // 학생 자가진단 고유 코드
		temp: Number(req.body.temp), // 발열 유무 1: 발열 0: 발열 없음
	};
	// TODO: 자가진단 로직 구현
	res.status(200).send({
		result: true,
		message: "테스트",
	});
});

const server = app.listen(port, () => {
	Log.i(`PORT : ${port}`);
});

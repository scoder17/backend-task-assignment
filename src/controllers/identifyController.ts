import { Request, Response } from 'express';
import { handleIdentify } from '../services/identifyService';

export const identifyController = async (req: Request, res: Response) => {
  try {
    const result = await handleIdentify(req.body);
    res.status(200).json({ contact: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

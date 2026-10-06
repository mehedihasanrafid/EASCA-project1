declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        roleCode: string;
      };
    }
  }
}

export {};
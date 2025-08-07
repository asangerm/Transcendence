import userSchema from './user.schema';
import { ZodError, ZodIssue } from 'zod';

const validateUser = (data: any) => {
  const result = userSchema.safeParse(data);

  if (result.success) {
    return result.data;
  } else {
    const error = result.error as ZodError<any>;
    // Utiliser .issues au lieu de .errors
    const messages = error.issues.map((e: ZodIssue) => e.message);
    throw new Error(messages.join(', '));
  }
};

export default validateUser;


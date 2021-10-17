import logger from 'loglevel';

// do not use trace it generate errors
const logLevel = process.env.NEXT_PUBLIC_LOGLEVEL;
logger.setDefaultLevel(<any>logLevel);

export default logger;
import { createContext, useContext, Context } from "react";
import { Props } from '../utils/types';

const WebSocketContext: Context<string> = createContext()

export {
    WebSocketContext,
    useContext,
}
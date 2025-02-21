import {  message } from "antd";
export function assertMessageExist(condition:any,userMessage:string): asserts condition{
    debugger;
    if(condition){
        message.success(userMessage);
    }
}

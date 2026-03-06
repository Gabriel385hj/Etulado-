import { Buffer } from 'buffer';
import process from 'process';

// @ts-ignore
window.global = window;
// @ts-ignore
window.Buffer = Buffer;
// @ts-ignore
window.process = process;

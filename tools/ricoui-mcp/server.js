#!/usr/bin/env node
/**
 * Rico UI Brands & Google Stitch Design MCP Server (ESM Wrapper)
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsServer = require('./server.cjs');

export const handleToolCall = cjsServer.handleToolCall;
export const formatStitchPrompt = cjsServer.formatStitchPrompt;
export const TOOLS = cjsServer.TOOLS;

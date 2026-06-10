"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.getAiConfig = getAiConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function env(key, fallback = '') {
    return process.env[key] || fallback;
}
function envInt(key, fallback) {
    return parseInt(process.env[key] || String(fallback), 10);
}
exports.config = {
    port: envInt('PORT', 3000),
    supabase: {
        url: env('SUPABASE_URL'),
        anonKey: env('SUPABASE_ANON_KEY'),
    },
    ai: {
        provider: env('AI_PROVIDER', 'deepseek'),
        openai: {
            apiKey: env('OPENAI_API_KEY'),
            model: env('OPENAI_MODEL', 'gpt-4o'),
        },
        qianfan: {
            apiKey: env('QIANFAN_API_KEY'),
            model: env('QIANFAN_MODEL', 'ernie-4.0'),
        },
        deepseek: {
            apiKey: env('DEEPSEEK_API_KEY'),
            model: env('DEEPSEEK_MODEL', 'deepseek-chat'),
        },
    },
    platforms: {
        weixin: {
            appId: env('WEIXIN_APP_ID'),
            secret: env('WEIXIN_SECRET'),
        },
    },
};
function getAiConfig() {
    const p = exports.config.ai;
    switch (p.provider) {
        case 'openai':
            return { apiKey: p.openai.apiKey, baseUrl: 'https://api.openai.com/v1', model: p.openai.model };
        case 'qianfan':
            return { apiKey: p.qianfan.apiKey, baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat', model: p.qianfan.model };
        case 'deepseek':
            return { apiKey: p.deepseek.apiKey, baseUrl: 'https://api.deepseek.com', model: p.deepseek.model };
    }
}

# Manual Testing

## Input Engine Manual Test

1. Build the project:
```
npm run build
```

2. Run the fixed sample set:
```
npm run input-test
```

3. Run the interactive CLI (type :q to quit):
```
npm run input-cli
```

The CLI prints the normalized output for any input line.

If any output looks wrong, update the input engine tests in:
- src/input/normalize.test.ts
- src/input/tokenize.test.ts

## LLM Integration Manual Test (Phase 12B)
1. Set env:
```
LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
LLM_API_KEY=... 
LLM_DISABLE_CAPS=false
```

2. Start bot and send a short free-text message.
3. Confirm response changes when `LLM_DISABLE_CAPS=true`.
4. Confirm fallback to templates when LLM key is missing.

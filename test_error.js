const msg = `ContractFunctionExecutionError: The contract function "mint" reverted.

Error: User rejected the request.

Docs: https://viem.sh/docs/contract/writeContract.html
Version: viem@2.8.0`;

const docsMatch = msg.match(/Docs:\s*(https:\/\/[^\s]+)/);
console.log(docsMatch ? docsMatch[1] : null);

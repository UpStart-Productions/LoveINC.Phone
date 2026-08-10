import type {
  PlatformTransformationTool,
  PlatformTransformationToolStepInput,
} from '../services/platform/types';

export function pickLatestTransformationTool(
  tools: PlatformTransformationTool[]
): PlatformTransformationTool | null {
  if (!tools.length) {
    return null;
  }

  return [...tools].sort((a, b) => {
    const aMs = Date.parse(a.createdAt?.trim() || a.postedAt?.trim() || '') || 0;
    const bMs = Date.parse(b.createdAt?.trim() || b.postedAt?.trim() || '') || 0;
    if (bMs !== aMs) {
      return bMs - aMs;
    }
    return b.sortOrder - a.sortOrder;
  })[0];
}

export function transformationToolResponseKey(stepOrder: number, inputIndex: number): string {
  return `${stepOrder}:${inputIndex}`;
}

function isInputComplete(
  input: PlatformTransformationToolStepInput,
  value: string | string[] | undefined
): boolean {
  if (input.type === 'text' || input.type === 'radio') {
    return typeof value === 'string' && value.trim().length > 0;
  }

  return Array.isArray(value) && value.length > 0;
}

/** True when the tool has at least one input and every input has a saved response. */
export function isTransformationToolFullyComplete(
  tool: PlatformTransformationTool,
  responses: Record<string, string | string[]>
): boolean {
  const steps = tool.steps ?? [];
  let inputCount = 0;

  for (const step of steps) {
    for (let inputIndex = 0; inputIndex < (step.inputs ?? []).length; inputIndex++) {
      inputCount++;
      const input = step.inputs[inputIndex];
      const key = transformationToolResponseKey(step.order, inputIndex);
      if (!isInputComplete(input, responses[key])) {
        return false;
      }
    }
  }

  return inputCount > 0;
}

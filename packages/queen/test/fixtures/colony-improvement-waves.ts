import { type QueenOrderedPlanInput, orderedPlanFromWaves } from '../../src/decompose.js';

export const colonyImprovementWaveInput: QueenOrderedPlanInput = {
  slug: 'colony-improvement-plan',
  title: 'Colony improvement plan',
  problem:
    'Queen should model the manual Colony improvement plan as low-risk discoverability work first, deeper product work second, and the final documentation merge last.',
  acceptance_criteria: [
    'Wave 1 captures low-risk discoverability and coordination work.',
    'Wave 2 captures deeper Colony product adoption work.',
    'Wave 3 merges the documentation story after Wave 1 and Wave 2 are complete.',
  ],
  waves: [
    {
      id: 'wave-1',
      title: 'Low-risk discoverability work',
      subtasks: [
        {
          title: 'Improve attention_inbox ToolSearch ranking',
          description: 'Make attention_inbox easier to discover from ToolSearch.',
          file_scope: ['apps/mcp-server/README.md'],
          capability_hint: 'doc_work',
        },
        {
          title: 'Improve task_ready_for_agent adoption',
          description: 'Make task_ready_for_agent the default pull surface for ready work.',
          file_scope: ['apps/mcp-server/src/tools/ready-queue.ts'],
          capability_hint: 'api_work',
        },
        {
          title: 'Add search-before-implementation guidance',
          description: 'Guide agents to search existing Colony context before editing.',
          file_scope: ['docs/QUEEN.md'],
          capability_hint: 'doc_work',
        },
        {
          title: 'Improve claim-before-edit workflow',
          description: 'Clarify the file-claim step before implementation edits.',
          file_scope: ['docs/mcp.md'],
          capability_hint: 'doc_work',
        },
        {
          title: 'Add coordination-loop tests',
          description: 'Lock the search, claim, message, and ready-work coordination loop.',
          file_scope: ['apps/mcp-server/test/coordination-loop.test.ts'],
          capability_hint: 'test_work',
        },
      ],
    },
    {
      id: 'wave-2',
      title: 'Deeper product work',
      subtasks: [
        {
          title: 'Absorb OMX notepad usage',
          description: 'Move useful notepad handoff behavior into Colony-owned surfaces.',
          file_scope: ['packages/hooks/src/handlers/session-start.ts'],
          capability_hint: 'infra_work',
        },
        {
          title: 'Add Colony usage/adoption dashboard',
          description: 'Show whether agents are using the Colony coordination primitives.',
          file_scope: ['apps/cli/src/commands/debrief.ts', 'apps/cli/test/debrief.test.ts'],
          capability_hint: 'test_work',
        },
        {
          title: 'Improve task_message and attention_inbox loop',
          description: 'Close the loop between directed messages and attention triage.',
          file_scope: [
            'apps/mcp-server/src/tools/message.ts',
            'apps/mcp-server/src/tools/attention.ts',
            'apps/mcp-server/test/messages.test.ts',
          ],
          capability_hint: 'api_work',
        },
        {
          title: 'Reduce overlap with OMX state tools',
          description: 'Make the boundary between Colony state and OMX state explicit.',
          file_scope: ['docs/omx-state-boundary.md'],
          capability_hint: 'doc_work',
        },
      ],
    },
    {
      id: 'wave-3',
      title: 'Final docs merge',
      subtasks: [
        {
          title: 'Merge docs story and canonical startup loop',
          description:
            'Merge the complete Colony story only after discoverability and product work are done.',
          file_scope: ['README.md', 'docs/QUEEN.md', 'docs/mcp.md'],
          depends_on: [0, 1, 2, 3, 4],
          capability_hint: 'doc_work',
        },
      ],
    },
  ],
};

export const colonyImprovementWaveFixture = orderedPlanFromWaves(colonyImprovementWaveInput);

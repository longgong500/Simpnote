import { convertChineseToVexFlow } from '../notationConverter';

describe('convertChineseToVexFlow', () => {
  test('converts valid notation correctly', () => {
    const input = 'L:1/8 1 2 3 4 | 5 6 7 1 |';
    const result = convertChineseToVexFlow(input);

    expect(result).toBeDefined();
    expect(result.timeSignature).toBe('1/8');
    expect(result.measures).toHaveLength(2);
    expect(result.measures[0]).toHaveLength(4);
    expect(result.measures[1]).toHaveLength(4);
  });

  test('throws error for invalid time signature', () => {
    const input = 'L:1/0 1 2 3 4 |';
    expect(() => {
      convertChineseToVexFlow(input);
    }).toThrow('无效的时值设置');
  });

  test('throws error for mismatched measure values', () => {
    const input = 'L:1/8 1 2 | 1 2 3 |';
    expect(() => {
      convertChineseToVexFlow(input);
    }).toThrow('小节时值不匹配');
  });

  test('throws error for invalid notes', () => {
    const input = 'L:1/8 1 X 3 4 |';
    expect(() => {
      convertChineseToVexFlow(input);
    }).toThrow('无效的音符');
  });
});

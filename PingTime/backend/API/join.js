export function join1N({ left, right, leftKey, rightKey, aliasRight }) {
  return left.map((l) => {
    const matches = right.filter((r) => r[rightKey] === l[leftKey]);
    return {
      ...l,
      [aliasRight]: matches,
    };
  });
}

export function innerJoinFlat({ left, right, leftKey, rightKey }) {
  return left.flatMap((l) =>
    right
      .filter((r) => r[rightKey] === l[leftKey])
      .map((r) => ({
        ...l,
        ...r,
      }))
  );
}

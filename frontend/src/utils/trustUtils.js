export function getScoreColor(score) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBadgeColor(score) {
  if (score >= 75) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

export function getTrustBadge(score) {
  if (score >= 75) {
    return {
      level: 'trusted',
      color: 'bg-green-100 text-green-800 border-green-300',
      text: '✅ Trusted',
      icon: '✅'
    };
  }
  if (score >= 50) {
    return {
      level: 'cautious',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      text: '⚠️ Be Cautious',
      icon: '⚠️'
    };
  }
  return {
    level: 'risky',
    color: 'bg-red-100 text-red-800 border-red-300',
    text: '❌ High Risk',
    icon: '❌'
  };
}

// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805098188750848
#include "../../template.cpp"

void init()
{
    t = 1;
}

void solve()
{
    int n;
    cin >> n;
    map<int, int> memo;
    for (int i = 0, t; i < n; ++i)
    {
        cin >> t;
        for (int j = 0, k; j < t; ++j)
            cin >> k, ++memo[k];
    }
    int cnt = 0, ans = 0;
    for (auto &[k, v] : memo)
        if (v >= cnt)
            cnt = v, ans = k;
    cout << ans << ' ' << cnt;
}

// https://www.luogu.com.cn/problem/P1544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int f, v;
    cin >> f >> v;
    vvi matrix(f + 1, vi(v + 1));
    for (int i = 1; i <= f; ++i)
        for (int j = 1; j <= v; ++j)
            cin >> matrix[i][j];

    vvi dp(f + 1, vi(v + 1, -iINF)), pre(f + 1, vi(v + 1, -1));
    for (int i = 1; i <= f; ++i)
        for (int j = i, mx = i - 1; j <= v; ++j)
            pre[i][j] = mx, dp[i][j] = matrix[i][j] + (dp[i - 1][mx] == -iINF ? 0 : dp[i - 1][mx]),
            mx = dp[i - 1][j] > dp[i - 1][mx] ? j : mx;

    int ans = -iINF;
    for (int i = f; i <= v; ++i)
        ans = max(ans, dp[f][i]);
    cout << ans << endl;

    for (int i = f; i <= v; ++i)
        if (dp[f][i] == ans)
        {
            ans = i;
            break;
        }
    vi arr{ans};
    while (pre[f][ans] != 0 && pre[f][ans] != -1)
        arr.push_back(pre[f][ans]), ans = pre[f--][ans];
    for (int i = arr.size() - 1; i >= 0; --i)
        cout << arr[i] << ' ';
}

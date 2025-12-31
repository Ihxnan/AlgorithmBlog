// https://www.luogu.com.cn/problem/P2196
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vi arr(n);
    cin >> arr;
    vvi mp(n);
    for (int i = 0; i < n - 1; ++i)
        for (int j = i + 1, t; j < n; ++j)
        {
            cin >> t;
            if (t)
                mp[j].push_back(i);
        }

    int ans = 0;   // 最优解的下标
    vi dp = arr;   // dp[i] 表示从第i个格子出发能得到的最大分数, 最少arr[i]
    vi pre(n, -1); // pre[i] 表示从第i个格子出发能得到的最大分数的前一个格子

    // 状态转移方程:
    // dp[i] = max{ dp[p] + arr[i] } (p为所有能到达i的格子)
    for (int i = 1; i < n; ++i)
    {
        for (auto &p : mp[i])
            if (dp[p] + arr[i] > dp[i])
            {
                dp[i] = dp[p] + arr[i];
                pre[i] = p;
            }
        if (dp[i] > dp[ans])
            ans = i;
    }

    // 求路径
    int tmp = ans;
    vi path;
    while (tmp != -1)
        path.pb(tmp), tmp = pre[tmp];

    // 输出结果
    for (auto it = path.rbegin(); it < path.rend(); ++it)
        cout << *it + 1 << "\n "[it < path.rend()];
    cout << endl
         << dp[ans];
}

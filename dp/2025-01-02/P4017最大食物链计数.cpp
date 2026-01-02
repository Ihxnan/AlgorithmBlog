// https://www.luogu.com.cn/problem/P4017
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}


// 通过拓扑排序确保所有节点处理时，其食物链低端都已被处理过
void solve()
{
    int mod = 80112002;

    int n, m;
    cin >> n >> m;
    vi du(n + 1); // 记录每个节点的入度
    vvi mp(n + 1); // 有向图的邻接表
    for (int i = 0, a, b; i < m; ++i)
    {
        cin >> a >> b;
        ++du[b];
        mp[a].pb(b);
    }

    vi stk; // 存放待处理节点
    vi dp(n + 1); // 记录每个节点的食物链数量
    for (int i = 1; i <= n; ++i)
        if (!du[i])
            stk.pb(i), dp[i] = 1;

    while (stk.size())
    {
        auto x = stk.back();
        stk.qb();
        for (auto &p : mp[x])
        {
            dp[p] = (dp[x] + dp[p]) % mod;
            if (--du[p] == 0)
                stk.pb(p);
        }
    }

    int ans = 0;
    for (int i = 1; i <= n; ++i)
        if (mp[i].empty())
            ans = (dp[i] + ans) % mod; // 求和所有最大食物链的数量
    cout << ans;
}

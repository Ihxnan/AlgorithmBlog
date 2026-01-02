// https://www.luogu.com.cn/problem/P1434
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

// 通过优先队列实现从低到高处理每个格子，确保到达每个格子时，其所有高度更低的相邻格子都已被处理过
void solve()
{
    int r, c;
    cin >> r >> c;
    vvi mp(r + 1, vi(c + 1));                     // 记录每个格子的高度
    priority_queue<pair<int, pair<int, int>>> pq; // 优先队列，记录每个格子的高度和坐标
    for (int i = 1; i <= r; ++i)
        for (int j = 1; j <= c; ++j)
            cin >> mp[i][j], pq.push({-mp[i][j], {i, j}}); // 高度取负，方便计算最短路径

    int ans = 0; // 最长路径长度
    int dx[] = {0, 0, 1, -1};
    int dy[] = {1, -1, 0, 0};
    vvi dp(r + 1, vi(c + 1)); // 记录每个格子的最长路径

    // 状态转移方程:
    // dp[i][j] = max{ dp[a][b] } + 1 (a,b为(i,j)的四个相邻格子，且高度小于(i,j)的格子)
    while (pq.size())
    {
        auto [height, point] = pq.top();
        auto [x, y] = point;
        height = -height; // 取负号恢复原高度
        pq.pop();
        int mx = 0;
        for (int i = 0, a, b; i < 4; ++i)
        {
            a = x + dx[i];
            b = y + dy[i];
            if (a < 1 || a > r || b < 1 || b > c || mp[a][b] >= height) // 超出边界或高度大于等于当前高度，跳过
                continue;
            mx = max(mx, dp[a][b]);
        }
        dp[x][y] = mx + 1; // dp[x][y] = max{ dp[a][b] } + 1
        ans = max(ans, dp[x][y]);
    }
    cout << ans;
}

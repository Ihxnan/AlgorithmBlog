// https://www.luogu.com.cn/problem/P1002
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int ex, ey, hx, hy; // 终点和马的位置
    cin >> ex >> ey >> hx >> hy;
    ex += 2, ey += 2, hx += 2, hy += 2;

    vvi sta(25, vi(25)); // 记录不能走的点
    int dx[] = {0, 1, 1, 2, 2, -1, -1, -2, -2};
    int dy[] = {0, 2, -2, 1, -1, 2, -2, 1, -1};
    for (int i = 0; i < 9; ++i)
        sta[hx + dx[i]][hy + dy[i]] = 1;

    vvl dp(25, vl(25)); // 记录到达终点的路径数
    dp[1][2] = 1;

    // 状态转移方程：
    // dp[i][j] = dp[i - 1][j] + dp[i][j - 1] (sta[i][j] == 0)
    for (int i = 2; i <= ex; ++i)
        for (int j = 2; j <= ey; ++j)
            dp[i][j] = sta[i][j] ? 0 : dp[i - 1][j] + dp[i][j - 1];

    cout << dp[ex][ey];
}

// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805080346181632
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int l, n;
    cin >> l >> n;
    string ans(l, 'z');

    for (int i = 1; i < n; ++i)
    {
        if (--ans.back() < 'a')
        {
            ans.back() = 'z';
            int idx = l - 2;
            --ans[idx];
            while (ans[idx] < 'a')
            {
                ans[idx--] = 'z';
                if (idx >= 0)
                    --ans[idx];
            }
        }
    }

    cout << ans;
}

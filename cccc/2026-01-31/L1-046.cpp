// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805084284633088
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    int gl = 1, cnt = 1;
    while (gl < n)
    {
        gl = gl * 10 + 1;
        ++cnt;
    }
    while (1)
    {
        cout << gl / n;
        gl %= n;
        if (gl)
        {
            gl = gl * 10 + 1;
            ++cnt;
        }
        else
            break;
    }
    cout << ' ' << cnt;
}
